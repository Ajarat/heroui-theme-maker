import {STORY_RENDERED} from "storybook/internal/core-events";
import {addons} from "storybook/manager-api";

const STUDIO_STORY = "theme-studio--theme-studio";

/** The Studio needs the full canvas: tuck the addons panel away there and restore it on the way out. */
addons.register("theme-studio/layout", (api) => {
  let panelWasShown: boolean | null = null;

  api.on(STORY_RENDERED, (storyId: string) => {
    if (storyId === STUDIO_STORY && panelWasShown === null) {
      panelWasShown = api.getIsPanelShown();
      api.togglePanel(false);
    } else if (storyId !== STUDIO_STORY && panelWasShown !== null) {
      api.togglePanel(panelWasShown);
      panelWasShown = null;
    }
  });
});
