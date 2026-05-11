import { User } from 'src/generated/prisma/client';
import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: User;
}
