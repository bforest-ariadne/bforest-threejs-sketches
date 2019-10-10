			attribute vec2 reference;
			attribute float birdVertex;

			attribute vec3 birdColor;

			uniform sampler2D texturePosition;
			uniform sampler2D textureVelocity;

			// varying vec4 vColor;
			// varying float z;

			uniform float time;

			mat3 calcLookAtMatrix(vec3 origin, vec3 target, float roll) {
				vec3 rr = vec3(sin(roll), cos(roll), 0.0);
				vec3 ww = normalize(target - origin);
				vec3 uu = normalize(cross(ww, rr));
				vec3 vv = normalize(cross(uu, ww));
				return mat3(uu, vv, ww);
			}
			