import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { toDateOnly } from './dates';

export function ExpiryAfterIssued(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'expiryAfterIssued',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_value: unknown, args: ValidationArguments) {
          const record = args.object as {
            issuedDate?: string;
            expiryDate?: string;
          };
          if (!record.issuedDate || !record.expiryDate) {
            return true;
          }
          return toDateOnly(record.expiryDate) > toDateOnly(record.issuedDate);
        },
        defaultMessage() {
          return 'expiryDate must be after issuedDate';
        },
      },
    });
  };
}
