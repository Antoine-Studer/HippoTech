export const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec4 mvPosition = viewMatrix * worldPosition;
        vViewPosition = -mvPosition.xyz;
        
        gl_Position = projectionMatrix * mvPosition;
    }
`;

export const fragmentShader = `
    uniform sampler2D baseTexture;
    uniform vec2 uResolution;
    uniform float iTime;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    const float iridStrength = 0.6;        // Increased overall effect strength
    const float iridSaturation = 0.8;      // Increased color saturation
    const float fresnelStrength = 1.2;     // Reduced for less extreme angle dependency
    const float baseEffectLevel = 0.3;     // Base level of effect that's always visible
    const vec3 lightCol = vec3(.02, .7, .02);
    
    #define pal(t) ( .5 + .5 * cos( 6.283 * ( t + vec4(0,1,2,0)/3.) ) )
    
    vec3 greyScale(vec3 color, float lerpVal) {
        float greyCol = 0.3 * color.r + 0.59 * color.g + 0.11 * color.b;
        vec3 grey = vec3(greyCol, greyCol, greyCol);
        vec3 newColor = mix(color, grey, lerpVal);
        return newColor;
    }
    
    void main() {
        // Get the base texture color (original card texture)
        vec4 baseColor = texture2D(baseTexture, vUv);
        
        // Calculate view direction for fresnel
        vec3 viewDir = normalize(vViewPosition);
        
        // Modified fresnel effect with a base level always visible
        float fresnel = baseEffectLevel + (1.0 - baseEffectLevel) * 
                        pow(1.0 - max(0.0, dot(vNormal, viewDir)), fresnelStrength);
        
        // Enhanced animation parameters for more visible effect
        float timeOffset = iTime * 0.3;
        
        // Create more complex wave patterns that are visible at all angles
        float waveX = sin(vUv.x * 15.0 + timeOffset) * 0.5 + 0.5;
        float waveY = cos(vUv.y * 15.0 + timeOffset * 0.7) * 0.5 + 0.5;
        float waveDiag = sin((vUv.x + vUv.y) * 10.0 - timeOffset * 1.5) * 0.5 + 0.5;
        float wavePattern = mix(mix(waveX, waveY, 0.5), waveDiag, 0.5);
        
        // Create holographic/iridescent color with more variation
        vec4 iridColor = pal(fresnel * 0.3 + wavePattern * 0.4 + timeOffset * 0.1);
        vec3 iridColorDesaturated = greyScale(iridColor.rgb, 1.0 - iridSaturation);
        
        // Combine patterns for effect intensity - make sure there's always some effect
        float effectIntensity = mix(baseEffectLevel, 1.0, fresnel * wavePattern) * iridStrength;
        
        // Just add the holographic effect on top without darkening
        vec3 finalColor = baseColor.rgb + iridColorDesaturated * effectIntensity;
        
        // Ensure we're not washing out the image too much (optional brightness control)
        finalColor = min(finalColor, vec3(1.2)); // Allow some overbright for shine
        
        gl_FragColor = vec4(finalColor, baseColor.a);
    }
`;