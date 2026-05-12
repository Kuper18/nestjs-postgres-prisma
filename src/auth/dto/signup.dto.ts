import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John', minLength: 2, maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  firstName: string;

  @ApiProperty({ example: 'Doe', minLength: 2, maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  lastName: string;

  @ApiProperty({ example: 'P@ssw0rd!', minLength: 8, maxLength: 20 })
  @Length(8, 20)
  password: string;
}
