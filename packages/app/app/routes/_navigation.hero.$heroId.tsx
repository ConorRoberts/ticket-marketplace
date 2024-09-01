import { Stream } from "@cloudflare/stream-react";
import { Link, useLoaderData, type MetaFunction } from "@remix-run/react";
import { abilities, heroes, type HeroVideo } from "common/schema";
import { asc, eq } from "drizzle-orm";
import { ArrowLeftIcon } from "lucide-react";
import { useState, type FC } from "react";
import { MdQuestionMark } from "react-icons/md";
import { Image } from "~/components/Image";
import { Page } from "~/components/Page";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/utils/cn";
import { createMetadata, images } from "~/utils/createMetadata";
import { defineLoader } from "~/utils/remix";
import { db } from "../utils/db.server";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return createMetadata({
      title: "Hero",
    });
  }

  return createMetadata({
    title: data.hero.name,
    imageUrl: images.optimizeId(data.hero.fullImageId, { width: 500 }),
  });
};

export const loader = defineLoader(async (args) => {
  const heroId = args.params.heroId;

  if (!heroId) {
    throw new Error(`Missing "heroId" parameter`);
  }

  const hero = await db.query.heroes.findFirst({
    where: eq(heroes.id, heroId),
    with: {
      abilities: {
        orderBy: asc(abilities.order),
      },
      videos: true,
    },
  });

  if (!hero) {
    throw new Error("Hero not found");
  }

  return { hero };
});

const Route = () => {
  const { hero } = useLoaderData<typeof loader>();

  return (
    <Page>
      <Link
        to="/"
        className="mr-auto px-4 py-1 text-sm font-medium flex items-center gap-2 mb-4 hover:text-gray-200 transition"
      >
        <ArrowLeftIcon className="size-4" />
        <p>Back</p>
      </Link>
      <div className="flex flex-col sm:flex-row gap-8">
        <div className="w-full sm:w-96 h-96 sm:h-[500px] bg-gradient-to-t from-black/60 via-transparent to-black/60 shrink-0 grow-0">
          <Image
            imageId={hero.fullImageId}
            width={800}
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-8 items-center sm:items-start flex-1">
          <div className="space-y-2">
            <h1 className="font-extrabold text-3xl sm:text-4xl text-center sm:text-left">
              {hero.name}
            </h1>
            <p className="text-center sm:text-left">{hero.description}</p>
          </div>
          {hero.abilities.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-bold text-lg text-gray-300 text-center sm:text-start">
                Abilities
              </h2>
              <div className="flex items-center gap-4">
                {hero.abilities.map((e) => (
                  <TooltipProvider key={e.id} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="size-16 rounded-full overflow-hidden relative bg-gray-300 p-4 flex items-center justify-center">
                          {e.iconImageId ? (
                            <Image
                              className="object-cover brightness-0"
                              imageId={e.iconImageId}
                              width={250}
                            />
                          ) : (
                            <MdQuestionMark className="size-12 text-black" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{e.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
          {hero.videos.length > 0 && (
            <div className="space-y-2 w-full">
              <h2 className="font-bold text-lg text-gray-300 text-center sm:text-start">
                Videos
              </h2>
              <div className="flex items-center gap-4 flex-wrap w-full">
                {hero.videos.map((e) => (
                  <HeroVideoView key={e.id} data={e} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};

const HeroVideoView: FC<{ data: HeroVideo }> = (props) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={cn(
        "sm:w-[calc(50%-16px)] w-full h-auto shrink-0 grow-0 aspect-video rounded-lg overflow-hidden",
        !loaded && "bg-black/50 animate-pulse"
      )}
    >
      <Stream
        src={props.data.videoId}
        onLoadedData={() => setLoaded(true)}
        controls
        poster={`https://customer-hyinkc2tamlsbxwe.cloudflarestream.com/${props.data.videoId}/thumbnails/thumbnail.jpg?time=1s&height=300`}
      />
    </div>
  );
};

export default Route;
