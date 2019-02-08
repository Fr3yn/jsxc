import Log from './util/Log'
import * as defaultOptions from './OptionsDefault'
import IStorage from './Storage.interface';

const KEY = 'options';

interface OptionData {
   [key: string]: any
}

export default class Options {

   private static defaults: OptionData = defaultOptions;

   public static overwriteDefaults(options: OptionData) {
      let optionKeys = Object.keys(options);
      let defaultKeys = Object.keys(Options.defaults);
      let unknownOptionKeys = optionKeys.filter(e => defaultKeys.indexOf(e) < 0);

      if (optionKeys.indexOf('storage') > -1) {
         // We have to make sure the storage is already set before we call e.g. Log.warn.
         Options.defaults.storage = options.storage;
      }

      if (unknownOptionKeys.length > 0) {
         Log.warn('I don\'t know the following options and therefore I will ignore them.', unknownOptionKeys);

         for (let unknownKey of unknownOptionKeys) {
            delete options[unknownKey];
         }
      }

      Object.assign(Options.defaults, options);
   }

   public static addDefaults(options: OptionData) {
      let optionKeys = Object.keys(options);
      let defaultKeys = Object.keys(Options.defaults);
      let knownOptionKeys = optionKeys.filter(e => defaultKeys.indexOf(e) > -1);

      if (knownOptionKeys.length > 0) {
         Log.debug('I already know the following options: ', knownOptionKeys);

         for (let knownKey of knownOptionKeys) {
            delete options[knownKey];
         }
      }

      Object.assign(Options.defaults, options);
   }

   public static getDefault(key: string) {
      return Options.defaults[key];
   }

   constructor(private storage: IStorage) {

   }

   public getId(): string {
      return this.storage.getName() || 'client';
   }

   public get(keyChain: string): any {
      function get(keys: string[], primary: any = {}, secondary: any = {}) {
         let key = keys.shift();

         if (keys.length) {
            return get(keys, primary[key], secondary[key]);
         } else if (typeof primary[key] !== 'undefined') {
            return typeof primary[key] === 'object' && primary[key] !== null ? {...secondary[key], ...primary[key]} : primary[key];
         } else if (typeof secondary[key] !== 'undefined') {
            return secondary[key];
         }

         Log.debug(`I don't know any "${keyChain}" option.`);

         return undefined;
      }

      return get(keyChain.split('.'), this.storage.getItem(KEY), Options.defaults);
   };

   public set(keyChain: string, value: any) {
      let subKeys = keyChain.split('.');
      let options = this.storage.getItem(KEY) || {};

      function set(keys: string[], data: any = {}) {
         let key = keys.shift();

         if (keys.length) {
            data[key] = set(keys, data[key]);
         } else {
            data[key] = value;
         }

         return data;
      }

      this.storage.setItem(KEY, set(subKeys, options));

      if (typeof Options.defaults.onOptionChange === 'function') {
         Options.defaults.onOptionChange(this.getId(), keyChain, value, () => this.export());
      }
   };

   public registerHook(key: string, func: (newValue: any, oldValue?: any) => void) {
      this.storage.registerHook(KEY, (newData, oldData) => {
         let n = newData[key];
         let o = oldData && typeof oldData[key] !== 'undefined' ? oldData[key] : Options.defaults[key];

         if (n !== o) {
            func(n, o);
         }
      });
   }

   public export(): OptionData {
      return this.storage.getItem(KEY) || {};
   }
};
