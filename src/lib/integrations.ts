import { externalConfig } from "./external-config";

export function getStripePublishableKey() {
  return externalConfig.stripePublishableKey;
}

export function supportsEmailDelivery() {
  return Boolean(externalConfig.resendApiKey);
}
