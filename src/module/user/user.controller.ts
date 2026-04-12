import { Controller, Delete, Get, Patch, Param, Query, Body, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { UserService } from './user.service';
import { UserListQueryDto } from './dto/user-list-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Account } from '../account/entity/account.entity';

@ApiTags('users')
@Controller({ path: 'users', version: '1' })
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get('admin/all')
    @Auth(RolesEnum.ADMIN)
    @ApiOperation({
        summary: 'Get all app users with name, created date, phone, and accepted offers count',
    })
    @SuccessResponse('Users retrieved successfully')
    async getAllUsers(@Query() query: UserListQueryDto) {
        return this.userService.getAllUsersWithAcceptedOffers(query);
    }


    
    @Patch('toggle-status/:accountId')
    @Auth(RolesEnum.ADMIN)
    @SuccessResponse('User updated successfully')
    async toggleUserStatus(
        @Param('accountId') accountId: bigint
    ) {
        return this.userService.ToggleStatus(accountId);
    }

    @Get(':accountId')
    @Auth(RolesEnum.ADMIN)
    @SuccessResponse('User retrieved successfully')
    async getUser(
        @Param('accountId') accountId: bigint
    ) {
        return this.userService.findOne(accountId);
    }

    @Patch('profile/:accountId')
    @Auth()
    @SuccessResponse('User profile updated successfully')
    @ApiOperation({ summary: 'Update user profile (name, email, phone, status)' })
    async updateProfile(
        @Param('accountId') accountId: string,
        @Body() dto: UpdateUserDto,
        @CurrentUser() currentUser: Account
    ) {
        // Users can only update their own profile, admins can update any user
        const targetAccountId = BigInt(accountId);
        if (currentUser.role !== RolesEnum.ADMIN && currentUser.id !== targetAccountId) {
            throw new BadRequestException('Unauthorized: Cannot update another user\'s profile');
        }

        // If not admin, remove status field from update
        if (currentUser.role !== RolesEnum.ADMIN) {
            dto.status = undefined;
        }

        return this.userService.updateProfile(targetAccountId, dto);
    }

    @Delete(':accountId')
    @Auth(RolesEnum.ADMIN)
    @SuccessResponse('User deleted successfully')
    async deleteUser(
        @Param('accountId') accountId: bigint
    ){
        return this.userService.deleteProfile(accountId)
    }




}
