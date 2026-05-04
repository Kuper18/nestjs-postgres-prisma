import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  lastName: string;

  @Length(8, 20)
  password: string;
}
