import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ComplianceRecordsService } from './compliance-records.service';
import { CreateComplianceRecordDto } from './dto/create-compliance-record.dto';
import { EvaluateComplianceRecordDto } from './dto/evaluate-compliance-record.dto';
import { ListComplianceRecordsQuery } from './dto/list-compliance-records.query';
import { UpdateComplianceRecordDto } from './dto/update-compliance-record.dto';

@Controller('compliance-records')
export class ComplianceRecordsController {
  constructor(private readonly recordsService: ComplianceRecordsService) {}

  @Post()
  create(@Body() dto: CreateComplianceRecordDto) {
    return this.recordsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListComplianceRecordsQuery) {
    return this.recordsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.recordsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateComplianceRecordDto,
  ) {
    return this.recordsService.update(id, dto);
  }

  @Post(':id/evaluate')
  evaluate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: EvaluateComplianceRecordDto,
  ) {
    return this.recordsService.evaluate(id, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('hard', new ParseBoolPipe({ optional: true })) hard?: boolean,
  ) {
    return this.recordsService.remove(id, hard ?? false);
  }
}
