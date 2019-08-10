export interface PluginConfig {
  platform: string;
  name: string;
  token: string;
  debug?: boolean;
  instanceBlacklist?: Array<string>;
  accessoryFilter?: Array<string>;
}

export interface Instance {
  ipAddress: string;
  port: number;
  username: string;
  evCharacteristics?: {
    aid: number;
    iid: number;
    ev: boolean;
    ipAddress?: string;
    port?: number;
    username?: string;
    registered?: boolean;
  }[];
}

export interface HapService {
  iid: number;
  type: string;
  characteristics: any[];
  primary: boolean;
  hidden: boolean;

  // custom
  uniqueId?: string;
  serviceName?: string;
  accessoryInformation?: any;
  aid?: number;
  serviceType?: string;
  instance?: Instance;
}

export interface HapAccessory {
  aid: number;
  services: HapService[];
}

export interface HapInstance {
  ipAddress: string;
  instance: {
    addresses: string[];
    name: string;
    fqdn: string;
    host: string;
    referer: {
      address: string;
      family: string;
      port: number;
      size: number;
    };
    port: number;
    type: string;
    protocol: string;
    subtypes: any[];
    txt: {
      md: string;
      pv: string;
      id: string;
    }
  };
  accessories: {
    accessories: HapAccessory[];
  };
}