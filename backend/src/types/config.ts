

export interface ConfigFile {
    backup: {
        time: string,
        source: string,
        target: string,
        filename: string,
        delete_old_after_hours: number
    }
}