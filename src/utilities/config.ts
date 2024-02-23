import { commands, window, workspace } from "vscode";

const config = workspace.getConfiguration("patchwork");

export function makeURL(path: string): string {
    const baseUrl: string | undefined = config.get("baseUrl");

    try {
        return (new URL(path, baseUrl)).toString();
    } catch(ex) {
        throw new Error("An invalid base URL for Patchwork was provided. Check the extension configuration and reload");
    }
}

export const onConfigurationUpdate = workspace.onDidChangeConfiguration(async e => {
    if (e.affectsConfiguration("patchwork.baseUrl")) {
        const action = "Reload Window";

        const prompt = await window.showInformationMessage(
            "You've updated the Patchwork URL, reload the window for the new configuration to take effect.",
            action
        );

        if (prompt === action) {
            commands.executeCommand("workbench.action.reloadWindow");
        }
    }
});
