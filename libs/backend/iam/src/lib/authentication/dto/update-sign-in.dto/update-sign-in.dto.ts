import { PartialType } from "@nestjs/mapped-types";
import { SignInDto } from "../sign-in.dto/sign-in.dto";

export class UpdateSignInDto extends PartialType(SignInDto) {}
