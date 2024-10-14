export const resource = (name: string) => {
  return `${process.env.PULUMI_STACK}-${name}`;
};
