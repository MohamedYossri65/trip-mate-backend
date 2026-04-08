import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { UserProfile } from './entity/user.entity';
import { UserService } from './user.service';
import { Offer } from '../offers/entity/offer.entity';
import { UserController } from './user.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserProfile, Offer]),
    ],
    controllers: [UserController],
    providers: [
        UserService,
    ],
    exports: [
        UserService,
    ],
})
export class UserModule { }
