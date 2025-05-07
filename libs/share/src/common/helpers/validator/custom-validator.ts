import { validateDid } from '@share/share/did/did-validate';
import {
  ValidateBy,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export const IsDidFormat = (
  validationOptions?: ValidationOptions,
): PropertyDecorator => {
  if (!validationOptions) {
    validationOptions = {};
  }
  return ValidateBy(
    {
      name: 'IsDidFormat',
      validator: {
        validate(value, _args: ValidationArguments): boolean {
          return validateDid(value);
        },
      },
    },
    { ...validationOptions, message: 'Missing did format.' },
  );
};
