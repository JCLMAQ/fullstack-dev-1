import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';

import {
  Control,
  apply,
  customError,
  disabled,
  form,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import { FieldError } from '@fe/shared/utilities';
import { PersonalInfo } from '../models/personal-info';

const passwordSchema = schema<{ password: string; confirmPassword: string }>(
  (path) => {
    required(path.password, { message: 'Password is required' });
    required(path.confirmPassword, { message: 'Confirm Password is required' });
    validate(path, ({ valueOf }) => {
      const password = valueOf(path.password);
      const confirmPassword = valueOf(path.confirmPassword);

      if (password && confirmPassword && password !== confirmPassword) {
        return customError({
          kind: 'passwordsMismatch',
          message: 'Password should match',
        });
      }

      return null;
    });
  },
);

@Component({
  selector: 'lib-user-profile',
  imports: [
    JsonPipe,
    FieldError,
    Control
  ],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfile {
  personalInfo = signal<PersonalInfo>({
    firstName: '',
    lastName: '',
    dateOfBirth: new Date(),
    password: '',
    confirmPassword: '',
    hasEmergencyContact: false,
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  personalForm = form(this.personalInfo, (path) => {
    required(path.firstName, { message: 'First Name is required' });
    required(path.lastName, { message: 'Last Name is required' });
    required(path.dateOfBirth, { message: 'Date of Birth is required' });

    validate(path.dateOfBirth, ({ value }) => {
      const years = new Date().getFullYear() - value().getFullYear();
      if (years < 18) {
        return customError({
          message: 'You must be at least 18 years old',
          kind: 'minAge',
        });
      }

      return null;
    });

    apply(path, passwordSchema);

    required(path.emergencyContactName, {
      message: 'Name is required',
      when: ({ valueOf }) => valueOf(path.hasEmergencyContact),
    });
    required(path.emergencyContactPhone, {
      message: 'Phone is required',
      when: ({ valueOf }) => valueOf(path.hasEmergencyContact),
    });
    disabled(
      path.emergencyContactName,
      ({ valueOf }) => !valueOf(path.hasEmergencyContact),
    );
    disabled(
      path.emergencyContactPhone,
      ({ valueOf }) => !valueOf(path.hasEmergencyContact),
    );
  });
}
