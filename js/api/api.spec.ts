import { app } from "./api"

describe("app", () => {
  describe("get", () => {
    it("should send the correct type", () => {
      const sendRuntimeMessageSpy = jest.spyOn(window.browser.runtime, "sendMessage");

      const what = "applicationVersion";
      app.get(what);

      expect(sendRuntimeMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendRuntimeMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "app.get"
        })
      );


      sendRuntimeMessageSpy.mockRestore();
    });
  });
});
