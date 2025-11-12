import { InjectionToken } from '@angular/core';
import { Environment } from '../models/environment.model';

export const ENVIRONMENT_TOKEN = new InjectionToken<Environment>('Environment');
