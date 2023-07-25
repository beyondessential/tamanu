export interface ResponseError {
	name: string;
	message: string;
}

export interface RequestOptions {
	method?: "GET" | "POST" | "PUT" | "DELETE";
	headers?: Record<string, string>;
	body?: string;
}

export interface FetchImplementation {
	(url: Request | string | URL, config?: RequestOptions): Promise<Response>;
}

let fetchImplementation: FetchImplementation;
// eslint-disable-next-line no-undef
if (
	typeof window !== "undefined" &&
	Object.hasOwnProperty.call(window, "fetch")
) {
	// eslint-disable-next-line no-undef
	fetchImplementation = window.fetch.bind(window);
}

export function setFetchImplementation(implementation: FetchImplementation) {
	fetchImplementation = implementation;
}

export async function fetchOrThrowIfUnavailable(
	url: Request | string | URL,
	config?: RequestOptions,
): Promise<Response> {
	try {
		const response = await fetchImplementation(url, config);
		return response;
	} catch (e) {
		// eslint-disable-next-line no-console
		console.log(e.message);
		// apply more helpful message if the server is not available
		if (e.message === "Failed to fetch") {
			throw new Error(
				"The server is unavailable. Please check with your system administrator that the address is set correctly, and that it is running",
			);
		}
		throw e; // some other unhandled error
	}
}

export async function getResponseErrorSafely(
	response: Response,
): Promise<{ error: ResponseError }> {
	try {
		return await response.json();
	} catch (e) {
		// log json parsing errors, but still return a valid object
		// eslint-disable-next-line no-console
		console.warn(`getResponseJsonSafely: Error parsing JSON: ${e}`);
		return {
			error: { name: "JSONParseError", message: `Error parsing JSON: ${e}` },
		};
	}
}
