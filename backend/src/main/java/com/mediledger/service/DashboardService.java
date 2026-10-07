package com.mediledger.service;

import com.mediledger.dto.DashboardAlertsDto;
import com.mediledger.dto.DashboardSummaryDto;
import com.mediledger.dto.DashboardTrendDto;

import java.util.List;

public interface DashboardService {

    DashboardSummaryDto getDashboardSummary();

    List<DashboardTrendDto> getDashboardTrends(int days);

    DashboardAlertsDto getDashboardAlerts();
}
