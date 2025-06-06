import 'dotenv/config';

export default class Config {
  public static readonly PORT: number = parseInt(process.env.PORT, 10) || 3001;
}
