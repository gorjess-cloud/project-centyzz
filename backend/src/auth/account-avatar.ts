import { BadRequestException } from '@nestjs/common';
export function validateAccountAvatar(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (value === '') return '';
  if (
    typeof value !== 'string' ||
    value.length > 90000 ||
    !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  )
    throw new BadRequestException(
      'Choose a JPEG, PNG or WebP profile image smaller than 64 KB.',
    );
  const bytes = Buffer.from(value.split(',')[1], 'base64');
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp =
    bytes.subarray(0, 4).toString() === 'RIFF' &&
    bytes.subarray(8, 12).toString() === 'WEBP';
  if (
    bytes.length > 65536 ||
    !(jpeg || png || webp) ||
    !(value.startsWith('data:image/jpeg;')
      ? jpeg
      : value.startsWith('data:image/png;')
        ? png
        : webp)
  )
    throw new BadRequestException('The selected profile image is invalid.');
  return value;
}
