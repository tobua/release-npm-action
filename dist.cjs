var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// index.js
var import_core5 = __toModule(require("@actions/core"));
var import_child_process3 = __toModule(require("child_process"));

// package.js
var import_fs = __toModule(require("fs"));
var import_path = __toModule(require("path"));
var import_core = __toModule(require("@actions/core"));
var getPackageJsonPath = () => (0, import_path.join)(process.cwd(), "package.json");
var getPackage = () => {
  const packageJsonPath = getPackageJsonPath();
  (0, import_core.info)(packageJsonPath);
  const packageJsonFound = (0, import_fs.existsSync)(packageJsonPath);
  (0, import_core.info)(packageJsonFound);
  if (!packageJsonFound) {
    return { error: "package.json not found." };
  }
  const contents = JSON.parse((0, import_fs.readFileSync)(packageJsonPath, "utf-8"));
  if (!contents.name) {
    return { error: 'package.json is missing "name" property.' };
  }
  return {
    name: contents.name,
    scripts: contents.scripts
  };
};
var addPackageProperties = (newProperties) => {
  const packageJsonPath = getPackageJsonPath();
  const existingContents = JSON.parse((0, import_fs.readFileSync)(packageJsonPath, "utf-8"));
  const newContents = { ...existingContents, ...newProperties };
  (0, import_fs.writeFileSync)(packageJsonPath, JSON.stringify(newContents));
};

// release.js
var import_child_process = __toModule(require("child_process"));
var import_core2 = __toModule(require("@actions/core"));
var import_github = __toModule(require("@actions/github"));
var import_standard_version = __toModule(require("standard-version"));
var getRelease = (debugMode) => {
  const commitMessage = (0, import_child_process.execSync)("git log -1 --pretty=%B").toString();
  (0, import_core2.info)(`commitMessage ${commitMessage}`);
  const release = commitMessage.includes("release-npm");
  const major = commitMessage.includes("release-npm major");
  return {
    release: debugMode || release,
    major
  };
};
var createRelease = async (version, first, major) => {
  const debugMode = !(0, import_core2.getInput)("NPM_TOKEN") || (0, import_core2.getInput)("NPM_TOKEN") === "debug";
  if (first && !version) {
    version = "0.0.0";
  }
  addPackageProperties({ version });
  await (0, import_standard_version.default)({
    dryRun: debugMode,
    skip: {
      commit: true
    },
    firstRelease: first,
    releaseAs: major ? "major" : void 0
  });
  (0, import_child_process.execSync)("git push --follow-tags");
  let tagName = `v${version}`;
  if (!debugMode) {
    tagName = (0, import_child_process.execSync)("git describe HEAD --abbrev=0");
    (0, import_core2.info)(`Pushed release tag ${tagName}.`);
  }
  (0, import_core2.debug)(`version: ${version} tagName: ${tagName}`);
  if ((0, import_core2.getInput)("GITHUB_TOKEN")) {
    (0, import_core2.debug)("has github input");
  }
  if (process.env.GITHUB_TOKEN) {
    (0, import_core2.debug)("has github token");
  }
  if (debugMode) {
    return;
  }
  const github = new import_github.getOctokit(process.env.GITHUB_TOKEN);
  const createReleaseResponse = await github.repos.createRelease({
    owner: import_github.context.repo.owner,
    repo: import_github.context.repo.repo,
    tag_name: tagName,
    name: tagName,
    body: "body"
  });
  const {
    data: { id: releaseId, html_url: htmlUrl, upload_url: uploadUrl }
  } = createReleaseResponse;
  (0, import_core2.info)(`Release created ${releaseId} url: ${htmlUrl} upload: ${uploadUrl}.`);
};

// version.js
var import_node_fetch = __toModule(require("node-fetch"));
var import_core3 = __toModule(require("@actions/core"));
var getVersion = async (name) => {
  (0, import_core3.info)(`version for ${name}`);
  let first = true;
  let version;
  try {
    const response = await (0, import_node_fetch.default)(`https://registry.npmjs.org/${name}/latest`);
    const body = await response.json();
    first = body === "Not Found" || typeof body !== "object" || !body.version;
    version = body.version;
  } catch (error) {
    first = true;
  }
  (0, import_core3.info)(`version ${version} first ${first}`);
  return {
    first,
    version
  };
};

// publish.js
var import_child_process2 = __toModule(require("child_process"));
var import_core4 = __toModule(require("@actions/core"));
var publish = (dry) => {
  let command = "npm publish";
  if (dry) {
    command += " --dry-run";
  }
  let env = null;
  if ((0, import_core4.getInput)("NPM_TOKEN")) {
    (0, import_core4.info)("has npm token");
    env = {
      env: {
        NODE_AUTH_TOKEN: (0, import_core4.getInput)("NPM_TOKEN")
      }
    };
  }
  (0, import_core4.info)(env);
  try {
    (0, import_child_process2.execSync)(command, env);
  } catch (error) {
    (0, import_core4.info)("Failed to publish to npm.");
    (0, import_core4.info)(error);
  }
};

// index.js
var run = async () => {
  try {
    const token = (0, import_core5.getInput)("NPM_TOKEN");
    if (!token) {
      return (0, import_core5.setFailed)("Missing NPM_TOKEN action secret.");
    }
    (0, import_core5.debug)(`release-npm-action with node: ${(0, import_child_process3.execSync)("node -v").toString()}`);
    const debugMode = token === "debug";
    if (debugMode) {
      (0, import_core5.info)("Running in debug mode...");
    }
    const { release, major } = getRelease(debugMode);
    if (!release) {
      return (0, import_core5.info)("No release requested.");
    }
    (0, import_core5.info)(`${major ? "Major" : "Regular"} release requested.`);
    const { name, scripts, error } = getPackage();
    if (error && !debugMode) {
      return (0, import_core5.setFailed)(error);
    }
    const { first, version } = await getVersion(name);
    (0, import_core5.info)(`Publishing ${name} ${first ? "as first release" : `as ${version}`}.`);
    await createRelease(version, first, major);
    publish(debugMode);
  } catch (error) {
    (0, import_core5.setFailed)(error.message);
  }
};
run();
