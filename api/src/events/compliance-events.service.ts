import { Injectable } from '@nestjs/common';
import { merge, Observable, Subject, interval } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

type StreamEvent = {
  data: { type: string; reason?: string; at?: string };
};

@Injectable()
export class ComplianceEventsService {
  private readonly outbound = new Subject<StreamEvent>();
  private readonly changes = new Subject<string>();

  constructor() {
    this.changes.pipe(debounceTime(300)).subscribe((reason) => {
      this.outbound.next({
        data: { type: 'changed', reason, at: new Date().toISOString() },
      });
    });
  }

  stream(): Observable<StreamEvent> {
    const heartbeat = interval(15000).pipe(
      map(() => ({ data: { type: 'heartbeat' } })),
    );
    return merge(this.outbound.asObservable(), heartbeat);
  }

  notify(reason: string) {
    this.changes.next(reason);
  }
}
