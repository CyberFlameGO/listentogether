import { useEffect, useState } from 'react';
import Room from '../../models/Room';
import RoomSong from '../../models/RoomSong';
import Song from '../../models/Song';
import supabase from '../../util/supabase';

interface Dictionary<T> {
  [id: string]: T;
}

const useSongs = (roomID: number) => {
  const [dictionary, setDictionary] = useState<Dictionary<Song>>({});
  const [array, setArray] = useState<Song[]>([]);

  const table = 'songs';
  const whereColumn = 'room_id';

  useEffect(() => {
    if (roomID < 0) return;

    // Fetch initial data
    const fetchData = async () => {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(whereColumn, roomID);

      if (error) console.log('error', error);
      else {
        // Create dictionary out of array
        const updatedDictionary = data.reduce((dict, element) => {
          dict[element['id']] = element;
          return dict;
        }, {});

        setDictionary(updatedDictionary);
      }
    };

    fetchData();
  }, [roomID]);

  useEffect(() => {
    // Subscribe to future table changes
    const subscription = supabase
      .from(`${table}:${whereColumn}=eq.${roomID}`)
      .on('*', (payload) => {
        // console.log(`=== TABLE (${table}) ${payload.eventType} ===`);

        // Update data
        switch (payload.eventType) {
          case 'INSERT':
          case 'UPDATE':
            if (payload.new[whereColumn] !== roomID) return;

            // ==== LOGIC FOR MULTIPLE SONGS ====
            setDictionary((d) => {
              return {
                ...d,
                [payload.new['id']]: payload.new,
              };
            });

            // ==== LOGIC FOR SINGLE SONG ====
            // setDictionary({
            //   [payload.new['id']]: payload.new,
            // });
            return;
          case 'DELETE':
            setDictionary((d) => {
              if (!d[payload.old.id]) return d;

              delete d[payload.old.id];

              return { ...d };
            });
            return;
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomID]);

  useEffect(() => {
    setArray(
      Object.values(dictionary).sort((a, b) => {
        if (a.addedAt <= b.addedAt) return -1;
        else return 1;
      })
    );
  }, [dictionary]);

  return { dictionary, array };
};

export default useSongs;
