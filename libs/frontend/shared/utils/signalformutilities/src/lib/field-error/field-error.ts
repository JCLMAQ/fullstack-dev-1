import { Component, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';

@Component({
  selector: 'lib-field-error',
  imports: [],
  templateUrl: './field-error.html',
  styleUrl: './field-error.scss',
})
export class FieldError {
  fieldError = input.required<FieldState<any, any>>();
}
