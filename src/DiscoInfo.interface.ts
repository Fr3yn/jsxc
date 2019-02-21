
export interface IDiscoInfo {
   getIdentities(): string[]

   getFeatures(): string[]

   getForms()

   getFormByType(type: string)

   getCapsVersion(): String

   hasFeature(features: string[]): boolean
   hasFeature(feature: string): boolean
}
