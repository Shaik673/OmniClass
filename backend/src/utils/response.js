/**
 * Standard API response helpers
 */

export function successResponse(res, data, statusCode = 200, meta = null) {
  const payload = { success: true, data };
  if (meta) payload.meta = meta;
  if (res.req?.requestId) payload.requestId = res.req.requestId;
  return res.status(statusCode).json(payload);
}

export function paginatedResponse(res, data, { page, limit, total }) {
  return successResponse(res, data, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export function createdResponse(res, data) {
  return successResponse(res, data, 201);
}

export function noContentResponse(res) {
  return res.status(204).send();
}
