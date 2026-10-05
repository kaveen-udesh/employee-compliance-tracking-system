import { Global, Module } from '@nestjs/common';
import { ComplianceEventsService } from './compliance-events.service';

@Global()
@Module({
  providers: [ComplianceEventsService],
  exports: [ComplianceEventsService],
})
export class EventsModule {}
