import { silenceLogsInBlock, testdir } from "@cosm-changesets/test-utils";
import * as git from "@cosm-changesets/git";
import tag from "../index";

jest.mock("@cosm-changesets/git");

describe("tag command", () => {
  silenceLogsInBlock();

  describe("workspace project", () => {
    it("tags all packages", async () => {
      const cwd = await testdir({
        "package.json": JSON.stringify({
          private: true,
          workspaces: ["packages/*"],
        }),
        "packages/pkg-a/package.json": JSON.stringify({
          name: "pkg-a",
          version: "1.0.0",
          dependencies: {
            "pkg-b": "1.0.0",
          },
        }),
        "packages/pkg-b/package.json": JSON.stringify({
          name: "pkg-b",
          version: "1.0.0",
        }),
      });

      (git.getAllTags as jest.Mock).mockReturnValue(new Set());

      expect(git.tag).not.toHaveBeenCalled();
      await tag(cwd);
      expect(git.tag).toHaveBeenCalledTimes(2);
      expect((git.tag as jest.Mock).mock.calls[0][0]).toEqual("pkg-a@1.0.0");
      expect((git.tag as jest.Mock).mock.calls[1][0]).toEqual("pkg-b@1.0.0");
    });

    it("skips tags that already exist", async () => {
      const cwd = await testdir({
        "package.json": JSON.stringify({
          private: true,
          workspaces: ["packages/*"],
        }),
        "packages/pkg-a/package.json": JSON.stringify({
          name: "pkg-a",
          version: "1.0.0",
          dependencies: {
            "pkg-b": "1.0.0",
          },
        }),
        "packages/pkg-b/package.json": JSON.stringify({
          name: "pkg-b",
          version: "1.0.0",
        }),
      });

      (git.getAllTags as jest.Mock).mockReturnValue(
        new Set([
          // pkg-a should not be re-tagged
          "pkg-a@1.0.0",
        ])
      );

      expect(git.tag).not.toHaveBeenCalled();
      await tag(cwd);
      expect(git.tag).toHaveBeenCalledTimes(1);
      expect((git.tag as jest.Mock).mock.calls[0][0]).toEqual("pkg-b@1.0.0");
    });
  });

  describe("single package repo", () => {
    it("uses a simplified version-only tag", async () => {
      const cwd = await testdir({
        "package.json": JSON.stringify({
          private: true,
          name: "root-only",
          version: "1.0.0",
        }),
      });
      (git.getAllTags as jest.Mock).mockReturnValue(new Set());

      expect(git.tag).not.toHaveBeenCalled();
      await tag(cwd);
      expect(git.tag).toHaveBeenCalledTimes(1);
      expect((git.tag as jest.Mock).mock.calls[0][0]).toEqual("v1.0.0");
    });
  });
});
