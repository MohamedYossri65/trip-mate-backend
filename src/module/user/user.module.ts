import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { UserProfile } from './entity/user.entity';
import { UserService } from './user.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserProfile]),
    ],
    controllers: [],
    providers: [
        UserService,
    ],
    exports: [
        UserService,
    ],
})
export class UserModule { }
