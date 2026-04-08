import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { UserService } from './user.service';
import { UserListQueryDto } from './dto/user-list-query.dto';

@ApiTags('users')
@Controller({ path: 'users', version: '1' })
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get('admin/all')
	@Auth(RolesEnum.ADMIN)
	@ApiOperation({
		summary: 'Get all app users with name, created date, phone, and accepted offers count',
	})
	@SuccessResponse('Users retrieved successfully')
	async getAllUsers(@Query() query: UserListQueryDto) {
		return this.userService.getAllUsersWithAcceptedOffers(query);
	}
}
