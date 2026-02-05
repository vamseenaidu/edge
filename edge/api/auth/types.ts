export type ActorType = "human" | "service" | null;
export type AuthProvider = "oidc" | "saml" | "none";

export type ActorContext = {
  actor_id: string | null;
  actor_type: ActorType;
  auth_provider: AuthProvider;
};

export type ActorContextValue = ActorContext | null;
