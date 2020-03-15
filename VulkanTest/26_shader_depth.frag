#version 450
#extension GL_ARB_separate_shader_objects : enable

layout(binding = 1) uniform sampler2D texSampler;

layout(location = 0) in vec3 fragColor;
layout(location = 1) in vec2 fragTexCoord;

layout(location = 0) out vec4 outColor;

void main() {

	vec4 factor;
	vec4 color = texture(texSampler, fragTexCoord);
	if (fragTexCoord.x < 0.5)
	{
		factor = vec4(fragTexCoord.x, fragTexCoord.y, 0.5, 0.5);
	}
	else
	{
		factor = vec4(0.1, 0.2, 0.3, 0.4);
	}
    outColor = color * factor;
}