import { fetchUser, getNotification } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

async function Page() {
  const user = await currentUser();

  if (!user) return null;

  const userInfo = await fetchUser(user.id);

  if (!userInfo?.onboarded) redirect("/onboarding");

  const notification = await getNotification(userInfo._id);
  return (
    <section>
      <h1 className="head-text mb-10">Notifications</h1>

      <section className="mt-10 flex flex-col gap-5">
        {notification.length > 0 ? (
          <>
            //59:00
            {notification.map((activity) => (
              <Link
                key={activity._id}
                href={`/post/${activity.parentId}
                `}
              >
                <article className="activity-card">
                  <Image
                    src={activity.author.image}
                    alt="profile pic"
                    width={23}
                    height={23}
                    className="rounded-full object-cover"
                  />
                  <p className="!text-small-regular text-light-1">
                    <span className="mr-1 text-primary-500">
                      {activity.author.name}
                    </span>
                    {"  "}
                    Commented on your Post
                  </p>
                </article>
              </Link>
            ))}
          </>
        ) : (
          <p className=" !text-base-regular text-light-2">
            You currently do not have any notification 😒
          </p>
        )}
      </section>
    </section>
  );
}

export default Page;
