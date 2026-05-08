import { Schema, model, Document } from 'mongoose';

export interface IPlayer extends Document {
  name: string;
  position: 'guard' | 'forward' | 'center';
  defense: number;
  offense: number;
  shooting: number;
  passing: number;
  rebounding: number;
  fitness: number;
  ballHandler: boolean;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name:       { type: String, required: true, trim: true },
    position:   { type: String, enum: ['guard', 'forward', 'center'], required: true },
    defense:    { type: Number, min: 1, max: 10, default: 5 },
    offense:    { type: Number, min: 1, max: 10, default: 5 },
    shooting:   { type: Number, min: 1, max: 10, default: 5 },
    passing:    { type: Number, min: 1, max: 10, default: 5 },
    rebounding:  { type: Number, min: 1, max: 10, default: 5 },
    fitness:     { type: Number, min: 1, max: 10, default: 5 },
    ballHandler: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PlayerSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default model<IPlayer>('Player', PlayerSchema);
