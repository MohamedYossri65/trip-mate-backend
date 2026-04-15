import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-office-role.dto';
import { UpdateRoleDto } from './dto/update-office-role.dto';
import { CreateAdminRoleDto } from './dto/create-admin-role.dto';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { Auth } from 'src/common/guards/decorators/auth.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { AccountService } from '../account/account.service';
import { CurrentUser } from 'src/common/guards/decorators/user.decorator';
import { Account } from '../account/entity/account.entity';

@ApiTags('roles')
@Controller({ path: 'roles', version: '1' })
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly accountService: AccountService,
  ) {}

  @Post()
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Create a new role (Office only)' })
  @SuccessResponse('Role created successfully')
  async createOfficeRole(@Body() dto: CreateRoleDto ,@CurrentUser() user: Account) {
    return this.roleService.createOfficeRole(dto , user.id);
  }

  @Post('admin')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Create a new admin role (Admin only)' })
  @SuccessResponse('Admin role created successfully')
  async createAdminRole(@Body() dto: CreateAdminRoleDto, @CurrentUser() user: Account) {
    return this.roleService.createAdminRole(dto, user.id);
  }

  @Get()
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'List all roles (Office only)' })
  @SuccessResponse('Roles retrieved successfully')
  async findAll(@CurrentUser() user: Account) {
    return this.roleService.findOfficeRoles(user.id);
  }

  @Get('admin')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'List all admin roles (Admin only)' })
  @SuccessResponse('Admin roles retrieved successfully')
  async findAllAdminRoles(@CurrentUser() user: Account) {
    return this.roleService.findAdminRoles();
  }

  @Get(':id')
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Get a role by ID (Office only)' })
  @SuccessResponse('Role retrieved successfully')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findById(BigInt(id));
  }

  @Put(':id')
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Update a role (Office only)' })
  @SuccessResponse('Role updated successfully')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roleService.update(BigInt(id), dto);
  }

  @Put('admin/:id')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Update an admin role (Admin only)' })
  @SuccessResponse('Admin role updated successfully')
  async updateAdminRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminRoleDto,
  ) {
    return this.roleService.updateAdminRole(BigInt(id), dto);
  }

  @Delete(':id')
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Delete a role (Office only)' })
  @SuccessResponse('Role deleted successfully')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.delete(BigInt(id));
  }

  @Delete('admin/:id')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Delete an admin role (Admin only)' })
  @SuccessResponse('Admin role deleted successfully')
  async deleteAdminRole(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.deleteAdminRole(BigInt(id));
  }

  @Post('assign/:accountId')
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Assign a role to an account (Office only)' })
  @SuccessResponse('Role assigned successfully')
  async assignRole(
    @Param('accountId', ParseIntPipe) accountId: number,
    @Body() dto: AssignRoleDto,
  ) {
    // Validate that the role exists and is active
    const role = await this.roleService.findActiveById(BigInt(dto.roleId));
    if (!role) {
      throw new BadRequestException('Role not found or inactive');
    }
    await this.accountService.assignRole(BigInt(accountId), BigInt(dto.roleId));
  }

  @Delete('remove/:accountId')
  @Auth(RolesEnum.OFFICE)
  @ApiOperation({ summary: 'Remove role from an account (Office only)' })
  @SuccessResponse('Role removed successfully')
  async removeRole(
    @Param('accountId', ParseIntPipe) accountId: number,
  ) {
    await this.accountService.removeRole(BigInt(accountId));
  }
}

