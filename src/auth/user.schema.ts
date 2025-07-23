// src/auth/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document; // Mongoose document type

@Schema({ timestamps: true }) // Adds createdAt and updatedAt fields automatically
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string; // Store hashed password, NOT plain text
}

export const UserSchema = SchemaFactory.createForClass(User);