import { run as productSeed } from './seeds/product.seed';
import { run as userSeed } from './seeds/user.seed';
import { run as couponSeed } from './seeds/coupon.seed';

productSeed();
userSeed();
couponSeed();
