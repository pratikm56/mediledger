package com.mediledger.service.impl;

import com.mediledger.dto.*;
import com.mediledger.entity.Customer;
import com.mediledger.entity.User;
import com.mediledger.exception.ApiException;
import com.mediledger.exception.ResourceNotFoundException;
import com.mediledger.mapper.CustomerMapper;
import com.mediledger.repository.CustomerRepository;
import com.mediledger.repository.UserRepository;
import com.mediledger.service.AuditService;
import com.mediledger.service.CustomerService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;
    private final AuditService auditService;
    private final UserRepository userRepository;

    public CustomerServiceImpl(CustomerRepository customerRepository,
                               CustomerMapper customerMapper,
                               AuditService auditService,
                               UserRepository userRepository) {
        this.customerRepository = customerRepository;
        this.customerMapper = customerMapper;
        this.auditService = auditService;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerDto> searchCustomers(String query, Boolean activeOnly, Pageable pageable) {
        return customerRepository.searchCustomers(query, activeOnly, pageable)
                .map(customerMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerDto getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));
        return customerMapper.toDto(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerDto getCustomerByPhone(String phone) {
        Customer customer = customerRepository.findByPhone(phone.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "phone", phone));
        return customerMapper.toDto(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerDto> getActiveCustomers() {
        return customerRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(customerMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public CustomerDto createCustomer(CreateCustomerRequestDto request, String currentUsername) {
        String cleanPhone = request.getPhone().trim();
        // Allow duplicate for Walk-in default "0000000000", else check
        if (!cleanPhone.equals("0000000000") && customerRepository.findByPhone(cleanPhone).isPresent()) {
            throw new ApiException("Customer with phone number '" + cleanPhone + "' already exists", HttpStatus.CONFLICT);
        }

        Customer customer = new Customer();
        customer.setName(request.getName().trim());
        customer.setPhone(cleanPhone);
        customer.setEmail(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null);
        customer.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        customer.setDoctorName(request.getDoctorName() != null ? request.getDoctorName().trim() : null);
        customer.setGstNumber(request.getGstNumber() != null && !request.getGstNumber().isBlank() ? request.getGstNumber().trim().toUpperCase() : null);
        
        BigDecimal openBal = request.getOpeningBalance() != null ? request.getOpeningBalance() : BigDecimal.ZERO;
        customer.setOpeningBalance(openBal);
        customer.setCurrentBalance(openBal);
        customer.setCreditLimit(request.getCreditLimit() != null ? request.getCreditLimit() : BigDecimal.ZERO);
        customer.setActive(true);

        Customer saved = customerRepository.save(customer);

        logAudit(currentUsername, "CREATE_CUSTOMER", "CUSTOMER", saved.getId().toString(),
                "Registered customer '" + saved.getName() + "' (Phone: " + saved.getPhone() + ")");

        return customerMapper.toDto(saved);
    }

    @Override
    public CustomerDto updateCustomer(Long id, UpdateCustomerRequestDto request, String currentUsername) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));

        String cleanPhone = request.getPhone().trim();
        if (!cleanPhone.equals(customer.getPhone()) && !cleanPhone.equals("0000000000")) {
            customerRepository.findByPhone(cleanPhone).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new ApiException("Phone number '" + cleanPhone + "' is already assigned to another customer", HttpStatus.CONFLICT);
                }
            });
        }

        customer.setName(request.getName().trim());
        customer.setPhone(cleanPhone);
        customer.setEmail(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null);
        customer.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        customer.setDoctorName(request.getDoctorName() != null ? request.getDoctorName().trim() : null);
        customer.setGstNumber(request.getGstNumber() != null && !request.getGstNumber().isBlank() ? request.getGstNumber().trim().toUpperCase() : null);
        if (request.getCreditLimit() != null) {
            customer.setCreditLimit(request.getCreditLimit());
        }

        Customer updated = customerRepository.save(customer);

        logAudit(currentUsername, "UPDATE_CUSTOMER", "CUSTOMER", updated.getId().toString(),
                "Updated details for customer '" + updated.getName() + "'");

        return customerMapper.toDto(updated);
    }

    @Override
    public CustomerDto toggleCustomerStatus(Long id, String currentUsername) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));

        customer.setActive(!customer.isActive());
        Customer updated = customerRepository.save(customer);

        String action = updated.isActive() ? "ACTIVATE_CUSTOMER" : "DEACTIVATE_CUSTOMER";
        logAudit(currentUsername, action, "CUSTOMER", updated.getId().toString(),
                "Toggled customer active status to " + updated.isActive());

        return customerMapper.toDto(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerDto> getCustomersWithOutstanding(Pageable pageable) {
        return customerRepository.findCustomersWithOutstanding(pageable)
                .map(customerMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerOutstandingSummaryDto getOutstandingSummary() {
        Long count = customerRepository.countCustomersWithOutstanding();
        BigDecimal total = customerRepository.sumTotalReceivables();
        return new CustomerOutstandingSummaryDto(count != null ? count : 0L, total != null ? total : BigDecimal.ZERO);
    }

    private void logAudit(String username, String action, String entityType, String entityId, String details) {
        Long userId = null;
        if (username != null) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) userId = user.getId();
        }
        auditService.logAction(userId, action, entityType, entityId, details, "127.0.0.1");
    }
}
