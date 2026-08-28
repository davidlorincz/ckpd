/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as billing from "../billing.js";
import type * as completions from "../completions.js";
import type * as content from "../content.js";
import type * as crons from "../crons.js";
import type * as digiAdmin from "../digiAdmin.js";
import type * as digiuniverzita from "../digiuniverzita.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_code from "../lib/code.js";
import type * as lib_entitlement from "../lib/entitlement.js";
import type * as lib_ranges from "../lib/ranges.js";
import type * as members from "../members.js";
import type * as notes from "../notes.js";
import type * as partnerKeys from "../partnerKeys.js";
import type * as progress from "../progress.js";
import type * as quizzes from "../quizzes.js";
import type * as verification from "../verification.js";
import type * as video from "../video.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  billing: typeof billing;
  completions: typeof completions;
  content: typeof content;
  crons: typeof crons;
  digiAdmin: typeof digiAdmin;
  digiuniverzita: typeof digiuniverzita;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/code": typeof lib_code;
  "lib/entitlement": typeof lib_entitlement;
  "lib/ranges": typeof lib_ranges;
  members: typeof members;
  notes: typeof notes;
  partnerKeys: typeof partnerKeys;
  progress: typeof progress;
  quizzes: typeof quizzes;
  verification: typeof verification;
  video: typeof video;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
