#version 450
#extension GL_ARB_separate_shader_objects : enable
#extension GL_EXT_scalar_block_layout : require

layout(binding = 0, std430) buffer SSBO0
{
	uint g_console_cell[];
};

layout(binding = 1, std430) buffer SSBO1
{
	uint g_console_font[];
};

layout(binding = 2, std430) uniform UBO0
{
	uvec4 g_color[16][4];
};

layout(binding = 3, std430) uniform UBO1
{
  uint g_log2CharacterWidth;
  uint g_log2CharacterHeight;
  uint g_screenWidthInCharacters;
  uint g_dummy;
  int  g_horizontalPixelOffset;
  int  g_verticalPixelOffset;
  uint g_screenWidthInPixels;
  uint g_screenHeightInPixels;
  vec4 g_cursorPosition;
  vec4 g_cursorSize;
  uvec4 g_cursorColor;
};

layout(location = 0) out vec4 outColor;


#define kLog2GlyphWidth 3
#define kLog2GlyphHeight 3
#define kGlyphWidth (1<<kLog2GlyphWidth)
#define kGlyphHeight (1<<kLog2GlyphHeight)
#define kBitsPerByte 8
#define kBytesPerWord 4

vec4 uintToFloat4(uint u)
{
	vec4 result;
	result.x = (u >> 24) & 0xff;
	result.y = (u >> 16) & 0xff;
	result.z = (u >>  8) & 0xff;
	result.w = (u >>  0) & 0xff;
	return result / 255.0;
}

vec4 renderDebugText(uvec2 position)
{
	float cursor0Distance = length(vec2(position.x, position.y) - g_cursorPosition.xy);
	if(clamp(cursor0Distance, g_cursorSize.x, g_cursorSize.y) == cursor0Distance)
		return uintToFloat4(g_color[g_cursorColor.x][g_cursorColor.y>>2][g_cursorColor.y&3]);

	float cursor1Distance = length(vec2(position.x, position.y) - g_cursorPosition.zw);
	if(clamp(cursor1Distance, g_cursorSize.z, g_cursorSize.w) == cursor1Distance)
		return uintToFloat4(g_color[g_cursorColor.z][g_cursorColor.w>>2][g_cursorColor.w&3]);

	ivec2 pos;
	pos.x = int(position.x - g_horizontalPixelOffset);
	pos.y = int(position.y - g_verticalPixelOffset);
	if(pos.x < 0 || pos.x >= g_screenWidthInPixels || pos.y < 0 || pos.y >= g_screenHeightInPixels)
	 	return vec4(0, 0, 0, 0);

	const uint x = pos.x >> (g_log2CharacterWidth-kLog2GlyphWidth);
	const uint y = pos.y >> (g_log2CharacterHeight-kLog2GlyphHeight);

	const uint x_tile  = x / kGlyphWidth;
	const uint y_tile  = y / kGlyphHeight;

	const uint x_pixel = x % kGlyphWidth;
	const uint y_pixel = y % kGlyphHeight;

	const uint cell_index = (y_tile * g_screenWidthInCharacters) + x_tile;
	uint tile = g_console_cell[cell_index];	

	const uint glyph           = (tile>> 0) & 0x0000FFFF;
	const uint foregroundColor = (tile>>16) & 0x0000000F;
	const uint foregroundAlpha = (tile>>20) & 0x0000000F;
	const uint backgroundColor = (tile>>24) & 0x0000000F;
	const uint backgroundAlpha = (tile>>28) & 0x0000000F;

	if(glyph == 0)
		return vec4(0, 0, 0, 0);

	const uint bitsPerGlyph = kGlyphWidth * kGlyphHeight;
	const uint bytesPerGlyph = bitsPerGlyph / kBitsPerByte;
	const uint wordsPerGlyph = bytesPerGlyph / kBytesPerWord;
	const uint font_index = glyph * wordsPerGlyph + (y_pixel / kBytesPerWord);
	uint bits = g_console_font[font_index];
	bits >>= (y_pixel % kBytesPerWord) * kGlyphWidth;
	bits >>= kGlyphWidth - 1 - x_pixel;

	if(bool(bits & 1))
	  return uintToFloat4(g_color[foregroundAlpha][foregroundColor>>2][foregroundColor&3]);
	else
	  return uintToFloat4(g_color[backgroundAlpha][backgroundColor>>2][backgroundColor&3]);
}



void main() 
{
	outColor.r = gl_FragCoord.x / 800.0;
	outColor.g = gl_FragCoord.y / 600.0;
	outColor.b = gl_FragCoord.z;
	outColor.a = 1.0;

	uvec2 position = uvec2(gl_FragCoord.x, gl_FragCoord.y);

	vec4 textColor = renderDebugText(position);
  
	if(textColor.w == 0.0)
		discard;

	//float4 output = 0.0;
	//output.r = pos.x / 1920.0;
	//output.g = pos.y / 1080.0;
	//output.b = pos.z;
	//output.a = 1.0;
	//
	//if (uint(pos.x / 100.0) % 2)
	//{
		//discard;
	//}

	outColor = textColor;
}