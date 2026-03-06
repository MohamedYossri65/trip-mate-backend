import { ApiProperty } from '@nestjs/swagger';

export class UploadAttachmentsDto {
    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
        description: 'Array of files to upload',
    })
    attachments: Express.Multer.File[];
}