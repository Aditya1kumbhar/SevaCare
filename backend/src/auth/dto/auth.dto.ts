import { IsEmail, IsString, IsPhoneNumber, MinLength } from 'class-validator';

export class SignUpDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('IN')
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthResponseDto {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  token: string;
}
