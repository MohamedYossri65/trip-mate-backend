

import { Body, Controller, Delete, Get, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Auth } from 'src/common/guards/auth.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadAttachmentsDto } from './upload-attashments.dto';

@ApiTags('uploads')
@ApiBearerAuth()
@Auth()
@Controller('uploads')
export class FileUploadController {
    constructor(private readonly fileUploadService: FileUploadService) { }

    @Get('auth')
    @ApiOperation({ summary: 'Get ImageKit auth signature for client-side upload' })
    getAuthParameters() {
        return this.fileUploadService.getAuthParameters();
    }

    @Post('attachments')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UploadAttachmentsDto })
    @ApiOperation({ summary: 'Upload multiple attachments' })
    @UseInterceptors(FilesInterceptor('attachments'))
    async uploadAttachments(
        @UploadedFiles() files: Express.Multer.File[],
    ): Promise<string[]> {
        return this.fileUploadService.uploadAttachments(files);
    }

    @Delete('attachments')
    @ApiOperation({ summary: 'Delete attachment' })
    async deleteAttachments(
        @Body() attachmentUrl: string,
    ): Promise<void> {
        await this.fileUploadService.deleteAttachment(attachmentUrl);
    }
}