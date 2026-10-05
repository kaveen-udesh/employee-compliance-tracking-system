import { Controller, Get, Query, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ComplianceEventsService } from '../events/compliance-events.service';
import { DashboardReportQuery } from './dto/dashboard-report.query';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly events: ComplianceEventsService,
  ) {}

  @Get('dashboard')
  getDashboard(@Query() query: DashboardReportQuery) {
    return this.reportsService.getDashboard(query);
  }

  @Sse('stream')
  stream(): Observable<{ data: unknown }> {
    return this.events.stream();
  }
}
