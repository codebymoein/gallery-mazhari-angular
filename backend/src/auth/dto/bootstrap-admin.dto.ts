import { IsEmail, IsString, MinLength } from 'class-validator';

export class BootstrapAdminDto {
  @IsString()
  setupKey: string;

  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
