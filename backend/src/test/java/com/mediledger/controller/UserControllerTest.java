package com.mediledger.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediledger.dto.CreateUserRequestDto;
import com.mediledger.dto.LoginRequestDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String getAuthToken(String username, String password) throws Exception {
        LoginRequestDto request = new LoginRequestDto(username, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("token").asText();
    }

    @Test
    void testStaffCannotAccessUserList() throws Exception {
        String staffToken = getAuthToken("staff", "Staff@123");

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testAdminCanAccessUserList() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void testOwnerCanCreateStaffUser() throws Exception {
        String ownerToken = getAuthToken("owner", "Owner@123");

        String uniqueUsername = "cashier_" + System.currentTimeMillis();
        CreateUserRequestDto createDto = new CreateUserRequestDto();
        createDto.setUsername(uniqueUsername);
        createDto.setEmail(uniqueUsername + "@mediledger.local");
        createDto.setPassword("Cashier@123");
        createDto.setFullName("Junior Cashier");
        createDto.setRoleName("ROLE_STAFF");

        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value(uniqueUsername))
                .andExpect(jsonPath("$.data.roles", hasItem("ROLE_STAFF")));
    }

    @Test
    void testAdminCannotCreateOwnerUser() throws Exception {
        String adminToken = getAuthToken("admin", "Admin@123");

        String uniqueUsername = "new_owner_" + System.currentTimeMillis();
        CreateUserRequestDto createDto = new CreateUserRequestDto();
        createDto.setUsername(uniqueUsername);
        createDto.setEmail(uniqueUsername + "@mediledger.local");
        createDto.setPassword("NewOwner@123");
        createDto.setFullName("Attempted Owner");
        createDto.setRoleName("ROLE_OWNER");

        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }
}
