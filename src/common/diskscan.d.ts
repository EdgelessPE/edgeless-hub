interface MountpointList {
  labels: string[];
  name: string[];
  removable: boolean[];
}

export function get(): Promise<MountpointList>