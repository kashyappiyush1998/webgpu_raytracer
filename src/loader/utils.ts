import { quat, vec2, vec3 } from 'gl-matrix';

export function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

export function toFloat(num: number | undefined, defaultValue = 1) {
  const n = num !== undefined ? num : defaultValue;
  if (Number.isInteger(n)) {
    return `${n}.0`;
  }
  return n;
}

export type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Uint32Array
  | Float32Array;

export function newTypedArray(
  type: number,
  buffer: ArrayBuffer,
  byteOffset: number,
  length: number
) {
  switch (type) {
    case 5120:
      return new Int8Array(buffer, byteOffset, length);
    case 5121:
      return new Uint8Array(buffer, byteOffset, length);
    case 5122:
      return new Int16Array(buffer, byteOffset, length);
    case 5123:
      return new Uint16Array(buffer, byteOffset, length);
    case 5125:
      return new Uint32Array(buffer, byteOffset, length);
    case 5126:
      return new Float32Array(buffer, byteOffset, length);
    default:
      throw new Error('invalid component type');
  }
}

export function toIndices(array: TypedArray): Uint16Array | Uint32Array {
  if (array instanceof Uint16Array || array instanceof Uint32Array) {
    return array;
  }
  let toArray;
  if (array instanceof Float32Array) {
    toArray = new Uint32Array(array.length);
  } else {
    toArray = new Uint16Array(array.length);
  }
  array.forEach((element, index) => {
    toArray[index] = element;
  });
  return toArray;
}

export function joinArray(arrays: Array<Float32Array>) {
  let length = 0;
  arrays.forEach((array) => {
    length += array.length;
  });
  const joined = new Float32Array(length);
  length = 0;
  arrays.forEach((array) => {
    joined.set(array, length);
    length += array.length;
  });
  return joined;
}

export function createGPUBuffer(
  array: TypedArray,
  usage: number,
  device: GPUDevice
) {
  const buffer = device.createBuffer({
    size: (array.byteLength + 3) & ~3, // eslint-disable-line no-bitwise
    usage,
    mappedAtCreation: true,
  });
  let writeArary;
  if (array instanceof Int8Array) {
    writeArary = new Int8Array(buffer.getMappedRange());
  } else if (array instanceof Uint8Array) {
    writeArary = new Uint8Array(buffer.getMappedRange());
  } else if (array instanceof Int16Array) {
    writeArary = new Int16Array(buffer.getMappedRange());
  } else if (array instanceof Uint16Array) {
    writeArary = new Uint16Array(buffer.getMappedRange());
  } else if (array instanceof Uint32Array) {
    writeArary = new Uint32Array(buffer.getMappedRange());
  } else {
    writeArary = new Float32Array(buffer.getMappedRange());
  }
  writeArary.set(array);
  buffer.unmap();
  return buffer;
}

export function generateNormals(
  indices: TypedArray | null,
  positions: TypedArray
) {
  const normals = new Float32Array(positions.length);
  const vertexCount = indices ? indices.length : positions.length;
  for (let i = 0; i < vertexCount; i += 3) {
    const triIndices = [];
    for (let n = 0; n < 3; n += 1) {
      if (indices) {
        triIndices.push(indices[i + n]);
      } else {
        triIndices.push(i + n);
      }
    }
    const triangle = triIndices.map((vertexIndex) => {
      const index = vertexIndex * 3;
      return vec3.fromValues(
        positions[index],
        positions[index + 1],
        positions[index + 2]
      );
    });

    const dv1 = vec3.create();
    vec3.sub(dv1, triangle[1], triangle[0]);
    const dv2 = vec3.create();
    vec3.sub(dv2, triangle[2], triangle[0]);
    const normal = vec3.create();
    vec3.cross(normal, vec3.normalize(dv1, dv1), vec3.normalize(dv1, dv2));

    for (let n = 0; n < 3; n += 1) {
      const index = (i + n) * 3;
      for (let t = 0; t < 3; t += 1) {
        normals[index + t] += normal[t];
      }
    }
  }
  return normals;
}

export function generateTangents(
  indices: TypedArray | null,
  positions: TypedArray,
  normals: TypedArray,
  uvs: TypedArray
) {
  const tangents = new Float32Array((normals.length / 3) * 4);
  const vertexCount = indices ? indices.length : positions.length;
  for (let i = 0; i < vertexCount; i += 3) {
    const triIndices = [];
    for (let n = 0; n < 3; n += 1) {
      if (indices) {
        triIndices.push(indices[i + n]);
      } else {
        triIndices.push(i + n);
      }
    }
    const pos = triIndices.map((vertexIndex) => {
      const index = vertexIndex * 3;
      return vec3.fromValues(
        positions[index],
        positions[index + 1],
        positions[index + 2]
      );
    });
    const uv = triIndices.map((vertexIndex) => {
      const index = vertexIndex * 2;
      return vec2.fromValues(uvs![index], uvs![index + 1]);
    });

    const dv1 = vec3.create();
    vec3.sub(dv1, pos[1], pos[0]);
    const dv2 = vec3.create();
    vec3.sub(dv2, pos[2], pos[0]);
    const duv1 = vec2.create();
    vec2.sub(duv1, uv[1], uv[0]);
    const duv2 = vec2.create();
    vec2.sub(duv2, uv[2], uv[0]);

    const tangent = vec3.create();
    vec3.sub(
      tangent,
      vec3.scale(dv1, dv1, duv2[1]),
      vec3.scale(dv2, dv2, duv1[1])
    );
    vec3.scale(tangent, tangent, duv2[1] * duv1[0] - duv1[1] * duv2[0]);
    vec3.normalize(tangent, tangent);

    for (let n = 0; n < 3; n += 1) {
      const index = (i + n) * 4;
      for (let t = 0; t < 3; t += 1) {
        tangents[index + t] += tangent[t];
      }
      tangents[index + 3] = 1;
    }
  }
  return tangents;
}

export function getTextures(material: any) {
  const { baseColorTexture, metallicRoughnessTexture } =
    material.pbrMetallicRoughness;
  const { normalTexture, occlusionTexture, emissiveTexture } = material;
  return [
    baseColorTexture,
    metallicRoughnessTexture,
    normalTexture,
    occlusionTexture,
    emissiveTexture,
  ];
}

function lerp(a: number, b: number, x: number) {
  if (x < a) {
    return 0;
  }
  if (x > b) {
    return 1;
  }
  return (x - a) / (b - a);
}

export function interpQuat(
  input: TypedArray,
  o: TypedArray,
  time: number,
  method: string
) {
  let index = 1;
  while (index < input.length - 1 && time >= input[index]) {
    index += 1;
  }
  const t = lerp(input[index - 1], input[index], time);

  if (method === 'CUBICSPLINE') {
    const td = input[index] - input[index - 1];
    const t2 = t * t;
    const t3 = t2 * t;
    const i = 12 * index;
    const v0 = quat.fromValues(o[i - 8], o[i - 7], o[i - 6], o[i - 5]);
    const b0 = quat.fromValues(o[i - 4], o[i - 3], o[i - 2], o[i - 1]);
    const v1 = quat.fromValues(o[i + 4], o[i + 5], o[i + 6], o[i + 7]);
    const a1 = quat.fromValues(o[i], o[i + 1], o[i + 2], o[i + 3]);
    quat.scale(v0, v0, 2 * t3 - 3 * t2 + 1);
    quat.scale(b0, b0, td * (t3 - 2 * t2 + t));
    quat.scale(v1, v1, -2 * t3 + 3 * t2);
    quat.scale(a1, a1, td * (t3 - t2));
    const result = quat.fromValues(0, 0, 0, 0);
    quat.add(result, result, v0);
    quat.add(result, result, b0);
    quat.add(result, result, v1);
    quat.add(result, result, a1);
    return quat.normalize(result, result);
  }

  const q = [];
  for (let n = -1; n < 1; n += 1) {
    const i = 4 * (index + n);
    q.push(quat.fromValues(o[i], o[i + 1], o[i + 2], o[i + 3]));
  }

  if (method === 'STEP') {
    return t < 1 ? q[0] : q[1];
  }
  const result = quat.create();
  return quat.slerp(result, q[0], q[1], t);
}

export function interpVec3(
  input: TypedArray,
  output: TypedArray,
  time: number,
  method: string
) {
  let index = 1;
  while (index < input.length - 1 && time >= input[index]) {
    index += 1;
  }
  const t = lerp(input[index - 1], input[index], time);

  if (method === 'CUBICSPLINE') {
    const td = input[index] - input[index - 1];
    const t2 = t * t;
    const t3 = t2 * t;
    const i = 9 * index;
    const v0 = vec3.fromValues(output[i - 6], output[i - 5], output[i - 4]);
    const b0 = vec3.fromValues(output[i - 3], output[i - 2], output[i - 1]);
    const v1 = vec3.fromValues(output[i + 3], output[i + 4], output[i + 5]);
    const a1 = vec3.fromValues(output[i], output[i + 1], output[i + 2]);
    vec3.scale(v0, v0, 2 * t3 - 3 * t2 + 1);
    vec3.scale(b0, b0, td * (t3 - 2 * t2 + t));
    vec3.scale(v1, v1, -2 * t3 + 3 * t2);
    vec3.scale(a1, a1, td * (t3 - t2));
    const result = vec3.create();
    vec3.add(result, result, v0);
    vec3.add(result, result, b0);
    vec3.add(result, result, v1);
    vec3.add(result, result, a1);
    return result;
  }

  const v = [];
  for (let n = -1; n < 1; n += 1) {
    const i = 3 * (index + n);
    v.push(vec3.fromValues(output[i], output[i + 1], output[i + 2]));
  }

  if (method === 'STEP') {
    return t < 1 ? v[0] : v[1];
  }
  const result = vec3.create();
  return vec3.lerp(result, v[0], v[1], t);
}

export const gltfEnum: { [key: string]: string | number } = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4,
  9728: 'nearest',
  9729: 'linear',
  9984: 'linear',
  9985: 'linear',
  9986: 'linear',
  9987: 'linear',
  33071: 'clamp-to-edge',
  33648: 'mirror-repeat',
  10497: 'repeat',
};